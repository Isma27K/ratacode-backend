# MangaShell

MangaShell is a web application for reading and managing manga collections.

## Features

- Browse and search manga titles
- View manga details including description, genres, and authors
- Read manga chapters with image viewer
- Responsive design for desktop and mobile devices

## Tech Stack

- Frontend: React.js
- Backend: Node.js with Express
- Database: MongoDB
- Additional libraries: Axios, Cors, Dotenv

## Setup and Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/mangashell.git
   cd mangashell
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add the following:
   ```
   DB_URL=your_mongodb_connection_string
   DB_NAME=your_database_name
   MANGA_COLLECTION=your_manga_collection_name
   ```

4. Start the development server:
   ```
   npm start
   ```

5. For production deployment:
   ```
   npm run prod
   ```

## Project Structure

- `client/`: React frontend application
- `database/`: Database connection and query functions
- `index.js`: Main server file
- `proxy_server.js`: Proxy server for handling API requests

## API Endpoints

- `/api/manga/:id`: Get manga details by ID
- `/api/manga/search`: Search manga titles
- `/api/manga/chapter/:mangaId/:chapterId`: Get chapter images

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License.