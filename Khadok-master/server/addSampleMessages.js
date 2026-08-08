const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://arafatrahman4580_db_user:Gve0vxiR7cLGMhS0@cluster0.laf4xbg.mongodb.net/?appName=Cluster0";
const dns = require("dns")
dns.setServers(['1.1.1.1', '8.8.8.8'])
const client = new MongoClient(uri, {
  serverApi: {
    version: '1',
    strict: true,
    deprecationErrors: true,
  }
});

async function addSampleMessages() {
  try {
    await client.connect();
    const db = client.db("foodieecommerce");
    const collection = db.collection("customerMessages");

    const sampleMessages = [
      {
        name: "Anish Ahmed",
        email: "anish@example.com",
        phone: "01700000000",
        subject: "Great Service",
        message: "I really enjoyed your food delivery service. The food was fresh and arrived on time. Keep up the good work!",
        createdAt: new Date(),
        status: "read"
      },
      {
        name: "Fatima Khan",
        email: "fatima@example.com",
        phone: "01800000000",
        subject: "Feedback on Order",
        message: "The biryani was delicious! However, the delivery took a bit longer than expected. Overall great experience.",
        createdAt: new Date(),
        status: "unread"
      },
      {
        name: "Karim Hassan",
        email: "karim@example.com",
        phone: "01900000000",
        subject: "Support Request",
        message: "I have a question about my order. Can someone help me track my recent order? I haven't received it yet.",
        createdAt: new Date(),
        status: "unread"
      },
      {
        name: "Zara Ali",
        email: "zara@example.com",
        phone: "01700111111",
        subject: "Partnership Inquiry",
        message: "Hi, I own a restaurant in Chittagong and would like to know about becoming a partner with Foodie.",
        createdAt: new Date(),
        status: "read"
      },
      {
        name: "Ahmed Hossain",
        email: "ahmed@example.com",
        phone: "01700222222",
        subject: "App Issue",
        message: "I'm facing some issues with the mobile app. It crashes when I try to place an order. Please fix this.",
        createdAt: new Date(),
        status: "unread"
      }
    ];

    const result = await collection.insertMany(sampleMessages);
    console.log(`✅ ${result.insertedCount} sample messages added successfully!`);
    console.log("Messages added to MongoDB customerMessages collection");
    
  } catch (error) {
    console.error("❌ Error adding messages:", error);
  } finally {
    await client.close();
  }
}

addSampleMessages();
