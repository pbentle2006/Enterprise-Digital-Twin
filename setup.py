from setuptools import setup, find_packages

with open("README.md", "r", encoding="utf-8") as fh:
    long_description = fh.read()

setup(
    name="enterprise-digital-twin",
    version="0.1.0",
    author="Your Name",
    author_email="your.email@example.com",
    description="A digital twin platform for enterprise systems",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/yourusername/enterprise-digital-twin",
    packages=find_packages(),
    classifiers=[
        "Development Status :: 3 - Alpha",
        "Intended Audience :: Developers",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.8",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Operating System :: OS Independent",
    ],
    python_requires=">=3.8",
    install_requires=[
        "fastapi>=0.68.0",
        "uvicorn>=0.15.0",
        "python-dotenv>=0.19.0",
        "sqlalchemy>=1.4.0",
        "alembic>=1.7.0",
    ],
    extras_require={
        "dev": [
            "pytest>=6.2.5",
            "pytest-cov>=2.12.1",
            "black>=21.9b0",
            "isort>=5.9.3",
            "mypy>=0.910",
            "flake8>=3.9.2",
        ],
    },
    entry_points={
        "console_scripts": [
            "edt=enterprise_digital_twin.main:app",
        ],
    },
)
