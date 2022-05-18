const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const axios = require("axios");
const resizeImg = require("resize-img");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req, res) => {
  res.send("hi");
});

const ensureDirectoryExistence = (filePath) => {
  let dirname = path.dirname(filePath);
  if (fs.existsSync(dirname)) {
    return true;
  }
  ensureDirectoryExistence(dirname);
  fs.mkdirSync(dirname);
};

const downloadAndParseImage = async (url, width, height) => {
  try {
    const fileName = path.basename(url);

    const localFilePath = path.join("images", fileName);

    const response = await axios({
      method: "GET",
      url: url,
      responseType: "stream",
    });

    ensureDirectoryExistence(localFilePath);

    const w = response.data.pipe(fs.createWriteStream(localFilePath));

    w.on("finish", async () => {
      console.log("image downloaded!");

      const image = await resizeImg(fs.readFileSync(localFilePath), {
        width,
        height,
        format: "jpg",
      });

      let newImage = path.join("images", `${width}_${height}_${fileName}`);

      fs.writeFileSync(newImage, image);

      return newImage;
    });
  } catch (error) {
    console.log(error);
  }
};

app.get("/api/image", async (req, res) => {
  let img_url = req.query.url;
  let width = parseInt(req.query.w);
  let height = parseInt(req.query.h);

  downloadAndParseImage(img_url, width, height)
    .then((resizedImg) => {
      res.json({
        img: req.query.url,
        width,
        height,
        newImage: resizedImg,
      });
    })
    .catch((err) => {
      res.json(err);
    });
});

app.listen(3000, () => {
  console.log("http://localhost:3000/");
});
