from flask_restful import Api
from app import app
from .appAPI import appAPI

restServerInstance = Api(app)

restServerInstance.add_resource(appAPI,"/")
