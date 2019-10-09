# Use the Python3.6.8 container image
FROM python:3.6.8

# Set the workingdirectory to app
WORKDIR /app

# Copy the current directory contents into the container at /app
COPY . /app

RUN pip install pip==9.0.3 pybind11
RUN pip install -r requirements.txt

EXPOSE 5000

ENTRYPOINT ["python3"]
CMD ["run.py"]

