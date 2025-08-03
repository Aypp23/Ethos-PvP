# Ethos Profile Comparison

A modern web application that compares two Ethos profiles side-by-side using the Ethos API v2. Built with React, TypeScript, and Tailwind CSS.

## Features

- **Side-by-side Profile Comparison**: Compare two Ethos profiles with detailed metrics
- **Comprehensive Metrics**: View all key Ethos metrics including:
  - Ethos Score
  - Twitter follower count
  - Number of yaps (attestations)
  - Total XP and XP streaks
  - Reviews received (positive, neutral, negative)
  - Reviews given
  - Vouches given and received
  - ETH vouched amounts
  - Total votes cast
- **Real-time Data**: Fetches live data from Ethos API v2
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Modern UI**: Clean, intuitive interface with smooth animations
- **Error Handling**: Graceful error handling with retry functionality

## Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Build Tool**: Vite
- **API**: Ethos Network API v2

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd ethos-profile-comparison
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Usage

1. **Enter Usernames**: Input two X (Twitter) usernames without the @ symbol
2. **Compare Profiles**: Click "Compare Profiles" to fetch and display the comparison
3. **View Results**: See detailed metrics for both profiles side-by-side
4. **Detailed Comparison**: Scroll down to see a comprehensive comparison table
5. **Swap Profiles**: Use the swap button to quickly switch the order
6. **Refresh**: Use the refresh button to update the data

## API Integration

The application integrates with the following Ethos API v2 endpoints based on the [official documentation](https://developers.ethos.network/api-documentation/api-v2/):

- **Users**: `/users/twitter/{username}` - Get user by Twitter username
- **Score**: `/score/{userkey}` - Get user's Ethos score
- **XP**: `/xp/{userkey}` - Get user's XP data
- **Reviews**: `/reviews/received` and `/reviews/given` - Get review data
- **Vouches**: `/votes/vouches/given` and `/votes/vouches/received` - Get vouch data
- **Votes**: `/votes/cast` - Get voting data
- **Activities**: `/activities/userkey` and `/activities/profile/given` - Get user activities (yaps)
- **Contributions**: `/contributions/history` - Get user contribution history

## Project Structure

```
src/
├── components/          # React components
│   ├── MetricCard.tsx   # Individual metric display
│   ├── ProfileCard.tsx  # Complete profile display
│   ├── ComparisonView.tsx # Side-by-side comparison
│   └── UserInputForm.tsx # Username input form
├── services/            # API services
│   └── ethosApi.ts      # Ethos API integration
├── types/               # TypeScript type definitions
│   └── index.ts         # API response types
├── App.tsx              # Main application component
├── main.tsx             # Application entry point
└── index.css            # Global styles
```

## Configuration

The application uses the following configuration:

- **API Base URL**: `https://api.ethos.network/api/v2`
- **Request Timeout**: 10 seconds
- **Max Results**: 1000 items per API call

## Error Handling

The application handles various error scenarios:

- **Network Errors**: Displays user-friendly error messages
- **API Errors**: Shows specific error messages from the Ethos API
- **Invalid Usernames**: Validates input and shows appropriate errors
- **Missing Profiles**: Handles cases where users don't have Ethos profiles

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Run tests: `npm run lint`
5. Commit your changes: `git commit -am 'Add feature'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Ethos Network](https://ethos.network/) for providing the API
- [Lucide](https://lucide.dev/) for the beautiful icons
- [Tailwind CSS](https://tailwindcss.com/) for the styling framework

## Support

If you encounter any issues or have questions, please:

1. Check the [Ethos API Documentation](https://developers.ethos.network/)
2. Open an issue in this repository
3. Contact the development team

---

Built with ❤️ for the Ethos community 