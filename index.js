import express from "express"
import axios from "axios"
import pg from "pg"
import bodyParser from "body-parser"


const app = express()
const port = 3000

app.use(bodyParser.urlencoded({ extended: true }))

app.get("/", (req,res)=>{
    res.render("index.ejs")
})
app.post('/getBook', async(req,res) =>{
    const result = req.body
    console.log(result)
    const words = result.book.split()
    const title = words.join("+")
    try {
    const link = await axios.get(`https://openlibrary.org/search.json?title=${title}`)
    const books = link.data.docs
    if (books.length === 0) {
        return res.send("book not found")
    }
    const imageOlid = books[0].cover_edition_key
    if (!imageOlid) {
        return res.send("Cover not found.");
    }
    const image = `https://covers.openlibrary.org/b/olid/${imageOlid}-L.jpg`

    res.render('index.ejs', {
        image : image
    })
    } catch (err) {
        console.log(err)
        res.send("Error retrieving book information.")
    }
})
app.listen(port,() =>{
    console.log(`server working on http://localhost:${port}`)
})