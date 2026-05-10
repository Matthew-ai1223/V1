# Online Voting System

A modern, secure, and responsive Online Voting System built with Node.js, Express, MongoDB, and Vanilla HTML/CSS/JS.

## Features

- **Authentication & Voter Verification:**
  - Admin uploads or adds eligible voters by email.
  - Only registered voters can access the voting portal.
  - Voters can only vote once.
  - Voting links are uniquely generated and can expire.

- **Admin Dashboard:**
  - Secure login using JWT.
  - Manage voters (Add, view, generate unique links).
  - Manage candidates (Add with image/logo, delete, view).
  - Manage Election Settings (Start time, end time, enable/disable voting).
  - View real-time election statistics (Total voters, votes cast, candidate vote counts).

- **Voting System:**
  - Secure and unique voting links.
  - Mobile-first, responsive interface.
  - Visual display of candidates, parties, and images.

- **Results & Analytics:**
  - Live election results updated in real-time (with Socket.io support).
  - Display votes and percentages per candidate.

## Technologies Used

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** Node.js, Express.js
- **Database:** MongoDB, Mongoose
- **Image Storage:** Cloudinary, Multer
- **Security:** JWT, bcryptjs
- **Real-time:** Socket.io

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally or a MongoDB Atlas connection string)
- Cloudinary Account (for image uploads)

## Setup Instructions

1. **Clone or Download the Project**

2. **Install Dependencies**
   \`\`\`bash
   npm install
   \`\`\`

3. **Configure Environment Variables**
   Open the \`.env\` file in the root directory and update it with your own credentials:
   \`\`\`env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/online-voting
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   FRONTEND_URL=http://localhost:5000
   \`\`\`

4. **Start the Server**
   \`\`\`bash
   npm start
   \`\`\`
   *(Note: Add \`"start": "node server.js"\` to your package.json scripts or simply run \`node server.js\`)*

5. **Initial Setup (Admin Creation)**
   To create your first Admin user, you can use a tool like Postman or curl to make a POST request to the setup endpoint:
   \`\`\`bash
   curl -X POST http://localhost:5000/api/auth/setup -H "Content-Type: application/json" -d "{\\"email\\":\\"admin@example.com\\",\\"password\\":\\"admin123\\"}"
   \`\`\`
   *After this, the setup route will be disabled to prevent unauthorized admin creation.*

## Usage Guide

1. **Access the Admin Portal:**
   Go to \`http://localhost:5000/admin-login.html\` and log in with your admin credentials.

2. **Configure the Election:**
   - Go to the **Settings** tab.
   - Set the Start and End times.
   - Check "Enable Voting" to open the polls.

3. **Add Candidates:**
   - Go to the **Manage Candidates** tab.
   - Fill in the candidate details and upload their image and party logo.

4. **Add Voters & Generate Links:**
   - Go to the **Manage Voters** tab.
   - Add voter email addresses.
   - Click "Generate Voting Links" to create unique access tokens for each voter.
   - The unique voting link will look like: \`http://localhost:5000/voting.html?token=UNIQUE_TOKEN\`
   - (In a production environment, you would use a service like Nodemailer to automatically email these links to the voters).

5. **Voting:**
   - Voters click their unique link.
   - They will see the secure ballot.
   - Once they cast their vote, they cannot vote again.

6. **View Results:**
   - Live results can be viewed at \`http://localhost:5000/results.html\`.
