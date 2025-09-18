from fastapi.testclient import TestClient
from enterprise_digital_twin.main import app

client = TestClient(app)

def test_read_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {
        "message": "Welcome to Enterprise Digital Twin API",
        "status": "operational",
        "version": "0.1.0"
    }
