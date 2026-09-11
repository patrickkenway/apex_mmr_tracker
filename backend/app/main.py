from fastapi import FastAPI
from .api.players import router as players_router
from .database import engine
from .api.sessions import router as sessions_router
from .api.matches import router as matches_router

app = FastAPI()

app.include_router(players_router)
app.include_router(sessions_router)
app.include_router(matches_router)


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
