from fastapi import APIRouter

api_router = APIRouter()


@api_router.get("/")
async def root():
    return {"message": "Hello World"}


@api_router.get("/hello/{name}")
async def say_hello(name: str):
    return {"message": f"Hello {name}"}
