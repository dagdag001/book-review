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

async function getCover(name) {
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
        
        await updateBookCover(image); 
        return image;
    } catch (err) {
        console.log(err);
        return null;
    }
}

// Function to update the book cover in the database
async function updateBookCover(imageUrl) {
    try {
        const result = await db.query(
            `UPDATE book_review
             SET cover = $1
             WHERE id = 2`, 
            [imageUrl]
        );
        console.log('Cover updated successfully');
    } catch (err) {
        console.log('Error updating cover:', err);
    }
}
app.get("/", async(req,res) => {
    try {
        const response = await db.query("SELECT book_name FROM book_review");
        const name = response.rows[0].book_name;

        const result = await db.query("SELECT * FROM book_review");
        console.log(result.rows)

        const review = result.rows[0].review;
        let cover = result.rows[0].cover;

        if (!cover) {
            const image = await getCover(name);
            cover = image; 
        }

        res.render('index.ejs', {
            name: name,
            review: review,
            image: cover
        });
    } catch (err) {
        console.log(err);
        res.sendStatus(504);  
}});

app.post('/getBook', async(req,res) =>{
   
})
app.listen(port,() =>{
    console.log(`server working on http://localhost:${port}`)
})