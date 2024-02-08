const express = require("express");
const bodyParser = require("body-parser");
const vision = require("@google-cloud/vision");
const CREDENTIALS = require("./keys.json");
const cors = require("cors");

const client = new vision.ImageAnnotatorClient({
  credentials: {
    private_key: CREDENTIALS.private_key,
    client_email: CREDENTIALS.client_email,
  },
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/detect-text", async (req, res) => {
  const imageUrl = req.body.imageUrl;
  if (!imageUrl) {
    return res.status(400).send("No image URL provided");
  }

  try {
    const [result] = await client.documentTextDetection(imageUrl);
    const fullTextAnnotation = result.fullTextAnnotation;

    if (!fullTextAnnotation) {
      return res.status(200).send({ detectedText: "Not detected" });
    }

    const calculateSize = (vertices) => {
      const width = vertices[1].x - vertices[0].x;
      const height = vertices[2].y - vertices[1].y;
      return width * height;
    };

    let largestText = '';
    let largestSize = 0;

    fullTextAnnotation.pages.forEach((page) => {
      page.blocks.forEach((block) => {
        block.paragraphs.forEach((paragraph) => {
          paragraph.words.forEach((word) => {
            const wordText = word.symbols.map(s => s.text).join('');
            const size = calculateSize(word.boundingBox.vertices);
            if (size > largestSize) {
              largestSize = size;
              largestText = wordText;
            }
          });
        });
      });
    });

    const productName = largestText || "Not detected";
    res.status(200).send({ productName });
    console.log(productName);
  } catch (error) {
    console.error("Error processing image:", error);
    res.status(500).send("Error processing image");
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});