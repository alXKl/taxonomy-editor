from flask_restful import Resource
import logging as logger

class appAPI(Resource):

    def get(self):

        logger.debug("Inside the post method of Task")

        projectDetails = {
                "version" : "1.0.0.0",
                "owner" : "Alex",
                "projectName" : "Taxonomy Editor"
        }


        return projectDetails,200