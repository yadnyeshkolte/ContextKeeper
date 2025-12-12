docker-compose --env-file .env up -d


docker run --pull=always --rm -it -p 8080:8080 --user=root ^
    -e HUGGINGFACE_API_KEY=hf_your_token_here ^
    -v "/var/run/docker.sock:/var/run/docker.sock" ^
    -v "C:/Temp:/tmp" kestra/kestra:latest server local