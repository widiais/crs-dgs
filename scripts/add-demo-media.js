// Demo script to add sample media for testing
// This would normally be done through the UI

const demoMedia = [
  {
    name: "Store Promotion Banner",
    type: "image/jpeg",
    category: "Promotion",
    duration: 5,
    url: "https://via.placeholder.com/1920x1080/FF6B6B/FFFFFF?text=Store+Promotion"
  },
  {
    name: "Product Showcase Video",
    type: "video/mp4", 
    category: "Store",
    duration: 10,
    url: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4"
  },
  {
    name: "Head Office Announcement",
    type: "image/png",
    category: "Head Office", 
    duration: 8,
    url: "https://via.placeholder.com/1920x1080/4ECDC4/FFFFFF?text=Head+Office+News"
  },
  {
    name: "New Product Launch",
    type: "video/mp4",
    category: "Promotion",
    duration: 15, 
    url: "https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_2mb.mp4"
  }
];

console.log("Demo media data:");
console.log(JSON.stringify(demoMedia, null, 2));

console.log("\nTo add this demo data:");
console.log("1. Go to http://localhost:3000/admin/media");
console.log("2. Upload some sample images and videos");
console.log("3. Assign them to displays for testing");
console.log("4. Test the slideshow at /client/[clientId]/display/[displayId]"); 