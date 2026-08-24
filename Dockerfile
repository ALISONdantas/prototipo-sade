FROM node:20

# Instala ferramentas globais necessárias (apenas ngrok, pois o expo já está local)
RUN npm install -g @expo/ngrok

WORKDIR /app

# Não vamos rodar npm install aqui!
# O container vai espelhar a sua pasta local (inclusive os node_modules que você já baixou no seu CachyOS).

EXPOSE 8081

CMD ["npx", "expo", "start", "--clear"]
