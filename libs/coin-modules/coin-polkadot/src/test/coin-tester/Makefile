IMAGE_NAME = coin-tester-chopsticks
CONTAINER_NAME = chopsticks

build:
		docker build -f chopsticks.Dockerfile -t $(IMAGE_NAME)\:latest .

run:
		docker run --rm -d -p "8000:8000" --name $(CONTAINER_NAME) $(IMAGE_NAME)\:latest
