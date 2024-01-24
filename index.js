const express = require("express");
const bodyParser = require("body-parser");
const vision = require("@google-cloud/vision");
const CREDENTIALS = require("./keys.json");

const client = new vision.ImageAnnotatorClient({
  credentials: {
    private_key: CREDENTIALS.private_key,
    client_email: CREDENTIALS.client_email,
  },
});

const app = express();
app.use(bodyParser.json());

app.post("/detect-text", async (req, res) => {
  const imageUrl = req.body.imageUrl;
  // const imageUrl = "https://storage.googleapis.com/hackathon-bucket-123/images/ProductImages/Britannia_Milano_Delight_Choco_Biscuits.png";
  if (!imageUrl) {
    return res.status(400).send("No image URL provided");
  }

  try {
    const [result] = await client.documentTextDetection(imageUrl);
    const fullTextAnnotation = result.fullTextAnnotation;
    const detectedText = fullTextAnnotation
      ? fullTextAnnotation.text.split("\n").join(" ")
      : "Not detected";
    res.status(200).send({ detectedText });
  } catch (error) {
    res.status(500).send("Error processing image");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
