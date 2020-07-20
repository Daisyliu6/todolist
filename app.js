const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("loadsh");
const app = express();
const dotenv = require("dotenv");

dotenv.config();
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(process.env.DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// items schema
const itemsSchema = { name: String };
// Item model
const Item = mongoose.model("Item", itemsSchema);
// lists schema
const listsSchema = {
  name: String,
  items: [itemsSchema],
};
// List model
const List = mongoose.model("List", listsSchema);
// 3 default items
const item1 = new Item({ name: "Welcome to your todolist!" });
const item2 = new Item({ name: "Hit the + button to add a new item." });
const item3 = new Item({ name: "<-- Hit this to delete an item." });

const defaultItems = [item1, item2, item3];

app.get("/", function (req, res) {
  // find all in the collection
  Item.find({}, function (err, foundItems) {
    // when there is no items in the collection then add the defaultItems
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successful saved default items to DB");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newItems: foundItems });
    }
  });
});

// customize list
app.get("/:listName", function (req, res) {
  const listName = _.capitalize(req.params.listName);
  List.findOne({ name: listName }, function (err, foundlist) {
    if (!err) {
      if (!foundlist) {
        // create a new list
        const list = new List({
          name: listName,
          items: defaultItems,
        });
        list.save();
        res.redirect("/" + listName);
      } else {
        // show the existing list
        res.render("list", {
          listTitle: foundlist.name,
          newItems: foundlist.items,
        });
      }
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listTitleName = req.body.list;
  const item = new Item({
    name: itemName,
  });
  if (listTitleName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listTitleName }, function (err, foundList) {
      foundList.items.push(item);
      foundList.save();
      res.redirect("/" + listTitleName);
    });
  }
});

app.post("/delete", function (req, res) {
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;
  if (listName === "Today") {
    Item.findByIdAndDelete(checkedItemId, function (err) {
      if (!err) {
        console.log("Delete successfully");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItemId } } },
      function (err, foundList) {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started successfully!");
});
