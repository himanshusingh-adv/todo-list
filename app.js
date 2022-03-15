require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();
// const items = ["Buy Food", "Cook Food", "Eat food"];

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");

mongoose.connect(
  `mongodb+srv://${process.env.MONGO_UID}:${process.env.MONGO_PASS}@cluster0.ibkwu.mongodb.net/todolistDB`
);

const itemsSchema = {
  name: String,
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
  name: "Welcome to our todolist !!",
});

const item2 = new Item({
  name: "Add a new todo by clicking '+'",
});

const item3 = new Item({
  name: "check the checkbox to delete",
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};

const List = mongoose.model("List", listSchema);

app.get("/", (req, res) => {
  // const today = new Date();
  // const options = {
  //     weekday: "long",
  //     day: "numeric",
  //     month: "long"
  // }

  // const day = today.toLocaleDateString("en-IN", options)

  Item.find({}, (err, foundItems) => {
    if (!err) {
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems, (err) => {
          if (!err) {
            res.redirect("/");
          }
        });
      } else {
        res.render("list", { listTitle: "Today", newListItems: foundItems });
      }
    }
  });
});

app.get("/:customListName", (req, res) => {
  const customListName = _.capitalize(req.params.customListName);

  List.findOne({ name: customListName }, (err, foundList) => {
    if (!err) {
      if (!foundList) {
        const list = new List({
          name: customListName,
          items: defaultItems,
        });
        list.save();

        res.redirect("/" + customListName);
      } else {
        // if (foundList.items.length === 0) {
        //     List.findOneAndUpdate({ name: customListName }, { items: defaultItems }, { new: true }, (err, result) => {
        //         if (err) {
        //             console.log(err);
        //         } else {
        //             console.log("succesfully inserted");
        //         }
        //     });
        //     return res.redirect("/" + customListName)
        // }
        res.render("list", {
          listTitle: foundList.name,
          newListItems: foundList.items,
        });
      }
    }
  });
});

function sleep(time) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

app.post("/", (req, res) => {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const item = new Item({
    name: itemName,
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, (err, foundList) => {
      foundList.items.push(item);
      foundList.save();
      // console.log("/" + listName);
      sleep(500).then(() => {
        res.redirect("/" + listName);
      });
    });
  }
});

app.post("/delete", (req, res) => {
  const checkboxId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkboxId, (err) => {
      if (!err) {
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkboxId } } },
      (err, foundList) => {
        if (!err) {
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.listen(process.env.PORT || 3000, () => {
  console.log("Server is running on http://localhost:3000");
});
