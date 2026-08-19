from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def root():
    return {"message": "MMR Tracker API works!"}
