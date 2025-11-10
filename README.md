# Flash Cards

A simple and interactive flash cards application built with React for learning Dutch words. This application helps you practice Dutch vocabulary by showing random word pairs with the ability to toggle between questions and answers.

## 🚀 Live Demo

Check out the live application here: [https://dineshkota3.github.io/flash-cards](https://dineshkota3.github.io/flash-cards)

## ✨ Features

- **Interactive Flash Cards**: Toggle between Dutch words and their English translations
- **Randomized Learning**: Cards are displayed in random order to enhance memorization
- **Clean Interface**: Simple and user-friendly design
- **Responsive**: Works on desktop and mobile devices
- **Instant Feedback**: Quickly flip between question and answer

## 🛠️ Built With

- **React 18** - Modern React with hooks
- **CSS3** - Styling with flexbox and modern CSS
- **JavaScript ES6+** - Modern JavaScript features
- **GitHub Pages** - Free hosting

## 📚 How to Use

1. **View the Question**: Each card displays a Dutch word or phrase
2. **Show Answer**: Click the "Show Answer" button to reveal the English translation
3. **Next Card**: Click "Next Card" to randomly select a new flash card
4. **Toggle Back**: Click "Show Question" to hide the answer and see the Dutch word again

## 🏗️ Project Structure

```
flash-cards/
├── src/
│   ├── App.js          # Main application component
│   ├── App.css         # Application styles
│   ├── data.json       # Dutch-English word pairs
│   └── index.js        # Application entry point
├── public/             # Static assets
└── README.md           # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/dineshkota3/flash-cards.git
cd flash-cards
```

2. Install dependencies:
```bash
npm install
```

### Development

Run the application in development mode:

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) to view it in your browser. The page will reload when you make changes.

### Building for Production

Create an optimized production build:

```bash
npm run build
```

### Deployment

This project is configured to deploy to GitHub Pages:

```bash
npm run deploy
```

## 📝 Adding New Words

To add new Dutch-English word pairs:

1. Open `src/data.json`
2. Add new entries in the format: `"dutch_phrase": "english_translation"`
3. Save the file and the changes will be reflected immediately

Example:
```json
{
    "appel": "apple",
    "hoe gaat het": "how are you",
    "doei": "bye",
    "goedenavond": "good evening"
}
```

## 🔧 Available Scripts

- `npm start` - Run development server
- `npm test` - Launch test runner
- `npm run build` - Build for production
- `npm run deploy` - Deploy to GitHub Pages
- `npm run eject` - Eject from Create React App (one-way operation)

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

Contributions are welcome! If you'd like to add more features or word pairs, feel free to:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📞 Contact

If you have any questions or suggestions, please feel free to reach out.
