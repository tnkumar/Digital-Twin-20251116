# Matterport Digital Twin Viewer

A web-based viewer for exploring public Matterport 3D spaces with an intuitive left-hand menu for space selection.

## Features

- 🏛️ **Multiple Public Spaces**: Browse through curated public Matterport spaces
- 🎨 **Modern UI**: Clean, dark-themed interface with smooth transitions
- 📱 **Responsive Design**: Works on desktop and mobile devices
- ⌨️ **Keyboard Navigation**: Use arrow keys to navigate between spaces
- 🔄 **Dynamic Loading**: Smooth loading states and transitions

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, or Edge)
- Internet connection to load Matterport models

### Installation

1. Clone this repository or download the files
2. Open `index.html` in your web browser

Alternatively, serve the files using a local web server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000` in your browser.

## Usage

1. **Select a Space**: Click on any space in the left-hand menu
2. **Explore**: Use your mouse to navigate the 3D environment
   - Click and drag to look around
   - Scroll to zoom in/out
   - Click on floor markers to move to different locations
3. **Switch Spaces**: Click another space in the menu or use arrow keys

## Keyboard Shortcuts

- `↑` Arrow Up - Navigate to previous space
- `↓` Arrow Down - Navigate to next space

## Customization

### Adding Your Own Spaces

Edit the `spaces` array in `app.js`:

```javascript
const spaces = [
    {
        id: 1,
        name: "Your Space Name",
        description: "Description of the space",
        modelId: "YOUR_MATTERPORT_MODEL_ID"
    },
    // Add more spaces...
];
```

To get a Matterport model ID:
1. Visit a public Matterport showcase
2. Look at the URL: `https://my.matterport.com/show/?m=MODEL_ID`
3. Copy the `MODEL_ID` value

### Styling

Modify the CSS variables in `styles.css` to change colors and appearance:

```css
:root {
    --primary-color: #2563eb;
    --sidebar-bg: #1f2937;
    --text-primary: #ffffff;
    /* ... more variables */
}
```

## Browser Compatibility

- Chrome/Edge: ✅ Fully supported
- Firefox: ✅ Fully supported
- Safari: ✅ Fully supported
- Mobile browsers: ✅ Responsive layout

## Technologies Used

- HTML5
- CSS3 (Flexbox, CSS Variables)
- Vanilla JavaScript
- Matterport Showcase SDK (iframe embed)

## License

This project is open source and available under the MIT License.

## Acknowledgments

- Matterport for providing the 3D showcase technology
- Public spaces are provided by their respective creators on Matterport's platform