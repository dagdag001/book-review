import express from "express"
import axios from "axios"
import pg from "pg"
import bodyParser from "body-parser"


const app = express()
const port = 3000

const db = new pg.Client({
    user: "postgres",
    host: "localhost",
    database: "books",
    password: "H@lalpig14",
    port: 5432
})

app.use(express.static("public"))
app.use(bodyParser.urlencoded({ extended: true }))

db.connect()

async function getCover(name, bookId) {
    const words = name.split(" ");
    const title = words.join("+"); 

    try {
        const link = await axios.get(`https://openlibrary.org/search.json?title=${title}`);
        const books = link.data.docs;
        if (books.length === 0) {
            return null; 
        }
        const imageOlid = books[0].cover_edition_key;
        if (!imageOlid) {
            return null;
        }
        const image = `https://covers.openlibrary.org/b/olid/${imageOlid}-S.jpg`;
        
        await updateBookCover(image, bookId); 
        return image;
    } catch (err) {
        console.log(err);
        return null;
    }
}

// Function to update the book cover in the database
async function updateBookCover(imageUrl, bookId) {
    try {
        await db.query(
            `UPDATE book_review
             SET cover = $1
             WHERE id = $2`, 
            [imageUrl, bookId]
        );
        console.log('Cover updated successfully');
    } catch (err) {
        console.log('Error updating cover:', err);
    }
}
app.get("/", async(req,res) => {
    try {
        const books = await db.query("SELECT * FROM book_review");
        await Promise.all(books.rows.map(async (book) => {
            if (book.cover == null){
            await getCover(book.book_name, book.id);}
        }));

        const result = await db.query("SELECT * FROM book_review");

        res.render('index.ejs', {
            response:result.rows,
        });
    } catch (err) {
        console.log(err);
        res.sendStatus(502);  
}});

app.get('/new', (req,res) =>{
    res.render('new.ejs')
   
})
app.post('/add_new', async (req,res) => {
    try{
    const title = req.body.input_title
    const review = req.body.input_review
    const result = await db.query ("insert into book_review(book_name, review) values ($1, $2)", [title, review])
    res.redirect('/')
    } catch(err){
        console.log("Error sending data" , err)
        res.sendStatus(502)
    }
})
app.post("/delete", async (req,res) =>{
    const id = req.body.deleteItemId;
    console.log(id)
    try{
    await db.query('delete from book_review where id = $1', [id])
    res.redirect('/')
    } catch (err){
            res.sendStatus(502)
    }
} )
app.post("/edit", async (req,res) =>{
    const id = req.body.editItemId;
    const review = req.body.editReview
    console.log(id, '  ', review)
    if (!id || !review) {
        return res.status(400).send("Missing ID or review"); // Error handling
    }
    try{
    await db.query('update book_review set review = $1 where id = $2', [review, id])
    res.redirect('/')
    } catch (err){
            res.sendStatus(502)
    }
} )
app.listen(port,() =>{
    console.log(`server working on http://localhost:${port}`)
})