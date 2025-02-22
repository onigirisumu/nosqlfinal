# NoSQL Final Project - Jewelry Store

## Overview

This project is a full-stack jewelry store application that leverages Node.js, Express, and MongoDB for the backend, and EJS with custom CSS for the frontend. It offers a wide range of features from user authentication (with strong password enforcement) and profile management (including avatar uploads and posts) to product management, a shopping cart and order system, and even a personalized recommendation engine powered by a FastAPI microservice. This combination of features provides a unique and interactive shopping experience.

## Features

- **User Authentication & Security**
  - Sign-up with strong password validation (minimum 9 characters, includes numbers and symbols).
  - Secure sign-in and session management.
  - Profile management with avatar uploads and ability to post updates.
  
- **Admin Panel**
  - Admin users (role `"admin"`) can manage user accounts (view, create, update, delete).
  - Role-based access control to protect admin routes.

- **Product Management**
  - CRUD operations for products.
  - Products are stored in a MongoDB database with indexing for efficient search.

- **Shopping Cart & Order System**
  - Users can add products to a cart, update quantities, and place orders.
  - Orders are saved in MongoDB and the cart is cleared upon successful order placement.

- **Personalized Recommendation Engine**
  - A separate FastAPI microservice provides personalized jewelry recommendations based on user preferences (style, skin tone, zodiac sign).
  - Integration with the Express app using Axios for a seamless experience.

- **Interactive Quiz**
  - A quiz page that helps users discover which jewelry pieces match their unique style.
  - The quiz integrates with the recommendation engine for personalized suggestions.

- **Advanced Search & Filter**
  - Users can search products by ID and filter by category (e.g., rings, bracelets, necklaces, earrings) and price range.

## Technology Stack

- **Backend:** Node.js, Express, FastAPI (Python), MongoDB, Mongoose, Motor (for FastAPI)
- **Frontend:** EJS, CSS
- **Other:** Axios, Multer (file uploads), bcrypt for password hashing, express-session for session management

## Setup and Installation

### Clone the Repository
