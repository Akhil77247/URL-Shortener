import express from "express";
import { readFile, writeFile } from "fs/promises";
import crypto from "crypto";
import path from "path";

const app = express();
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
const PORT = 3001;
const Data_File = path.join(import.meta.dirname,"data", "links.json");


const loadLinks = async () => {
    try {
        const data = await readFile(Data_File, "utf-8");
        return JSON.parse(data);
    }
    catch (error) {
        if (error.code === "ENOENT") {
            await writeFile(Data_File, JSON.stringify({}));
            return {};
        }
        throw error;
    }

}

const saveLinks = async (links) => {
    await writeFile(Data_File, JSON.stringify(links));
}



// -----Creating a server-----

app.get("/", async (req, res) => {
    try {
        const file = await readFile(path.join("views", "index.html"));
        const links = await loadLinks();
        const content = file.toString().replaceAll("{{Shortened-urls}}",
            Object.entries(links)
            .map(([shortCode, url]) =>{
                const truncatedUrl = url.length > 30? `${url.slice(0,30)}...` : url;
                return `<li><a class="text-blue-600" href="/${shortCode}" target="_blank">${req.get("host")}/${shortCode}</a><br/> -> ${truncatedUrl} </li>`
            } 
        ).join("")
    )
        return res.send(content);
    }
    catch (err) {
        console.log(err);
        return res.status(500).send("Internal server error");
    }
})

app.get("/:shortCode", async (req, res) => {
    try {
        const { shortCode } = req.params;
        const links = await loadLinks();
        if (!links[shortCode]) return res.status(404).send("Page Not Found");
        res.redirect(links[shortCode]);
    }
    catch (err) {
        console.log(err);
        return res.status(500).send("Internal server error");
    }
})

app.post("/", async (req, res) => {
    try {
        let { url, shortCode } = req.body;

        const finalShortCode =
            shortCode || crypto.randomBytes(4).toString("hex");

        const links = await loadLinks();

        if (links[finalShortCode]) {
            return res.status(400).send("Short code already exists. Please try another");
        }

        links[finalShortCode] = url;

        await saveLinks(links);

        return res.redirect("/");
    } catch (err) {
        console.log(err);
        return res.status(500).send("Internal server error");
    }
});


app.listen(PORT, () => {
    console.log(`Server Running at ${PORT} `);
})



