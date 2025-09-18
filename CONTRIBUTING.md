# Contributing to Enterprise Digital Twin

Thank you for your interest in contributing to Enterprise Digital Twin! We welcome contributions from everyone.

## Getting Started

1. Fork the repository on GitHub
2. Clone your fork locally
3. Create a new branch for your changes
4. Make your changes
5. Run tests to ensure everything works
6. Submit a pull request

## Development Setup

1. Set up a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   ```

2. Install development dependencies:
   ```bash
   pip install -r requirements.txt
   pip install -e .
   ```

3. Run tests:
   ```bash
   pytest
   ```

## Code Style

- Follow [PEP 8](https://www.python.org/dev/peps/pep-0008/) for Python code
- Use type hints for better code clarity
- Write docstrings for all public functions and classes
- Keep lines under 100 characters

## Commit Messages

- Use the present tense ("Add feature" not "Added feature")
- Keep the first line under 50 characters
- Reference issues and pull requests liberally

## Pull Requests

1. Keep pull requests focused on a single feature or bug fix
2. Update the README.md with details of changes if needed
3. Ensure all tests pass
4. Add tests for new features

## Reporting Issues

When reporting issues, please include:
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Any relevant error messages
- Your environment details

## License

By contributing to Enterprise Digital Twin, you agree that your contributions will be licensed under the MIT License.
