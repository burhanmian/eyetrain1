# Contributing to EyeTrain1

Thank you for considering contributing to EyeTrain1! This document provides guidelines and instructions for contributing.

## Code of Conduct

Please be respectful and constructive in all interactions.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/burhanmian/eyetrain1/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots if applicable
   - Environment details (OS, Node version, etc.)

### Suggesting Enhancements

1. Check existing feature requests
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Possible implementation approach

### Pull Requests

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation as needed

4. **Test your changes**
   ```bash
   npm run dev
   ```
   - Test all affected functionality
   - Ensure no existing features are broken

5. **Commit your changes**
   ```bash
   git commit -m "Add: brief description of changes"
   ```
   
   Use conventional commit messages:
   - `Add:` for new features
   - `Fix:` for bug fixes
   - `Update:` for changes to existing features
   - `Remove:` for removed features
   - `Docs:` for documentation changes

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Create a Pull Request**
   - Provide a clear title and description
   - Reference related issues
   - Explain what changes were made and why

## Development Setup

### Prerequisites
- Node.js 14+
- npm or yarn
- Git

### Setup Steps

1. Clone your fork
   ```bash
   git clone https://github.com/YOUR_USERNAME/eyetrain1.git
   cd eyetrain1
   ```

2. Install dependencies
   ```bash
   npm install
   cd client && npm install && cd ..
   ```

3. Set up environment
   ```bash
   cp .env.example .env
   ```

4. Start development server
   ```bash
   npm run dev
   ```

## Project Structure

```
eyetrain1/
├── server/           # Backend API
│   └── index.js
├── client/           # Frontend React app
│   ├── public/
│   └── src/
│       ├── components/
│       ├── App.js
│       └── index.css
├── uploads/          # Uploaded files
├── models/           # Generated models
└── docs/             # Documentation
```

## Coding Standards

### JavaScript/React
- Use ES6+ syntax
- Use functional components with hooks
- Keep components small and focused
- Use meaningful variable names
- Add PropTypes or TypeScript types

### CSS
- Use BEM naming convention where appropriate
- Keep styles modular
- Use CSS variables for theme colors
- Ensure responsive design

### API Design
- RESTful endpoints
- Consistent response formats
- Proper HTTP status codes
- Clear error messages

## Testing

Currently, the project has minimal testing. Contributions to improve test coverage are especially welcome!

### Future Testing Goals
- Unit tests for API endpoints
- Component tests for React
- Integration tests
- E2E tests

## Areas for Contribution

### High Priority
- Real AI integration for photo-to-3D conversion
- Actual rigging algorithms
- 3D preview with Three.js
- User authentication
- Cloud storage

### Medium Priority
- Animation timeline editor
- Batch processing
- Export format improvements
- Performance optimization
- Mobile responsiveness

### Documentation
- API examples
- Video tutorials
- Use case documentation
- Developer guides

## Questions?

Feel free to:
- Open an issue for questions
- Start a discussion
- Contact maintainers

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
