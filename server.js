const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const app = express();
require("dotenv").config();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

const SHOP = process.env.SHOPIFY_SHOP;
const TOKEN = process.env.SHOPIFY_ADMIN_TOKEN;

app.get("/add-options", async (req, res) => {
  const draftOrderId = req.query.draft_order_id;

  try {
    const draftOrderRes = await axios.get(`https://${SHOP}/admin/api/2023-10/draft_orders/${draftOrderId}.json`, {
      headers: {
        "X-Shopify-Access-Token": TOKEN,
      },
    });

    const draftOrder = draftOrderRes.data.draft_order;
    res.render("form", { draftOrder, shop: SHOP });
  } catch (err) {
    res.status(500).send("Error fetching draft order.");
  }
});

app.post("/add-options", async (req, res) => {
  const draftOrderId = req.body.draft_order_id;
  const updatedLineItems = [];

  Object.keys(req.body).forEach((key) => {
    if (key.startsWith("card_")) {
      const index = key.split("_")[1];
      const cardMessage = req.body[`card_${index}`]?.trim();
      const comments = req.body[`comments_${index}`]?.trim();

      const properties = {};
      if (cardMessage) properties["Card message"] = cardMessage;
      if (comments) properties["Additional comments"] = comments;

      updatedLineItems.push({
        variant_id: req.body[`variant_id_${index}`],
        quantity: parseInt(req.body[`quantity_${index}`], 10),
        ...(Object.keys(properties).length > 0 && { properties })
      });
    }
  });

  try {
    await axios.put(`https://${SHOP}/admin/api/2023-10/draft_orders/${draftOrderId}.json`, {
      draft_order: { line_items: updatedLineItems },
    }, {
      headers: {
        "X-Shopify-Access-Token": TOKEN,
      },
    });

    res.send("Options saved! You can go back to the draft order.");
  } catch (err) {
    res.status(500).send("Error saving properties.");
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server running...");
});

