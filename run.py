import logging as logger
logger.basicConfig(level="DEBUG")

if __name__ == '__main__':
    logger.debug("Starting Flask Server")
    from api import*
    app.run(host="0.0.0.0", debug=False, use_reloader=False)