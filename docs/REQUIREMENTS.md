# SADE - Frontend (Requisitos e Como Rodar)

Este documento detalha todos os pré-requisitos, bibliotecas e comandos necessários para rodar a aplicação React Native (Expo) do SADE em sua máquina local.

## 🛠️ Pré-requisitos do Sistema (Requirements)

Antes de começar, garanta que sua máquina possui as seguintes ferramentas instaladas:

1. **Node.js** (Versão 18.x ou superior)
   - Verifique com: `node -v`
2. **NPM** (Gerenciador de pacotes, geralmente já vem com o Node)
   - Verifique com: `npm -v`
3. **Git** (Opcional, mas recomendado para versionamento)

### Para testar no celular físico (Recomendado e mais fácil)
- Celular Android ou iPhone conectado na **mesma rede Wi-Fi** que o seu computador.
- Aplicativo **Expo Go** instalado (disponível de graça na Google Play ou Apple App Store).

### Para testar em Emuladores (Opcional)
- **Android:** Instalar o [Android Studio](https://developer.android.com/studio) e configurar um Virtual Device (AVD).
- **iOS:** Instalar o Xcode (Apenas para macOS).

---

## 📦 Stack Tecnológica

As principais bibliotecas que fazem o aplicativo funcionar são:
- **Expo (React Native):** Framework base do aplicativo (`expo ~56.0.8`).
- **Gluestack-UI v2:** Biblioteca de componentes visuais (`@gluestack-ui/themed`).
- **Lucide React Native:** Biblioteca de ícones (`lucide-react-native`).
- **Zustand:** Gerenciamento do estado global e fluxo de Login (`zustand`).
- **Axios:** Cliente HTTP para conectar com o Backend Python (`axios`).
- **Expo Secure Store:** Para salvar o Token JWT criptografado no celular (`expo-secure-store`).

---

## 🚀 Passo a Passo para Rodar

### 1. Instalar as dependências
Abra o terminal na raiz da pasta `frontend-sade` e rode:
```bash
npm install
```
*(Isso vai baixar todas as bibliotecas necessárias para a pasta `node_modules`).*

### 2. Configurar o Backend
A interface foi programada para buscar os dados de uma API externa.
1. Crie um arquivo chamado `.env` na pasta `frontend-sade`.
2. Cole o seguinte conteúdo (ajustando o IP se for usar celular físico):
```env
EXPO_PUBLIC_API_URL=http://localhost:8000/api/v1
```
> **Nota:** Se você for usar o celular físico pelo Expo Go, troque `localhost` pelo endereço de IP da sua máquina na sua rede Wi-Fi (ex: `http://192.168.1.15:8000/api/v1`).

### 3. Iniciar a aplicação (Expo Metro Bundler)

Rode o comando:
```bash
npx expo start --clear
```

**Opções de visualização no terminal:**
- Aperte `w`: Para abrir direto no seu navegador de internet (Modo Web).
- Aperte `a`: Para abrir no Emulador Android (se estiver aberto).
- **QR Code:** Abra a câmera do seu celular, leia o código e ele abrirá no aplicativo Expo Go.

---

## ⚠️ Possíveis Problemas (Troubleshooting)

- **Fica carregando infinito no celular (Expo Go):** Isso é o celular não achando o seu computador na rede. Você pode apertar `w` para testar no navegador do PC, ou rodar `npx expo start --tunnel` (requer `ngrok` instalado no pc).
- **Erro `Network Error` ao apertar em Login:** Significa que o servidor Backend (FastAPI Python) não está rodando ou o IP configurado no `.env` está incorreto.
