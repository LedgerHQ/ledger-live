IMAGE_NAME = coin-tester-zombienet

build:
		docker build -f Dockerfile -t $(IMAGE_NAME)\:latest .

run:
		docker run --rm -it -p 3003\:3003 -p 1998\:1998 -p 31323\:31323 $(IMAGE_NAME)\:latest
