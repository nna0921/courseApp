# CourseBot - Course Registration System

A modern course registration system built with Node.js, Express, and MongoDB. CourseBot makes course management and registration easy for both students and administrators.

![CourseBot](public/images/course-map-logo.svg)

## Features

### For Students:
- Easy course registration and withdrawal
- Visual calendar of registered courses
- Filter available courses by various parameters
- Real-time course availability updates

### For Administrators:
- Comprehensive course management
- Student records management
- Generate reports on course registrations and enrollment statistics
- Override registration restrictions when necessary

## Technologies Used

- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **Frontend**: HTML, CSS, JavaScript
- **UI Libraries**: Bootstrap 5
- **Calendar Visualization**: FullCalendar

## Installation and Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/coursebot.git
   cd coursebot
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory with the following content:
   ```
   PORT=5004
   MONGODB_URI=your_mongodb_connection_string
   SESSION_SECRET=your_session_secret
   ```

4. Start the server:
   ```
   node index.js
   ```

5. Access the application:
   ```
   http://localhost:5004
   ```

## Login Credentials

### Student Login
- Roll Number: S12345
- Password: student123

### Admin Login
- Username: admin
- Password: admin123

## Project Structure

- `/config`: Database configuration
- `/middleware`: Authentication middleware
- `/models`: MongoDB schema models
- `/public`: Static assets (CSS, JS, images)
- `/routes`: Express routes
- `/views`: EJS templates

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Thanks to all contributors and testers who helped make this project possible.
- Special thanks to our instructors and mentors for their guidance.

  Published By: Anna Zubair (nna0921)
  
