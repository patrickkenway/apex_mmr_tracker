from fastapi import FastAPI

from .database import engine

app = FastAPI()


@app.get("/")
def root():
    return {"message": "MMR Tracker API works!"}


@app.get("/db-test")
def database_test():
    try:
        with engine.connect() as connection:
            return {"database": "connected"}
    except Exception as e:
        return {
            "database": "error",
            "message": str(e),
        }
