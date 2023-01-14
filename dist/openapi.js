var spec = {
  openapi: "3.0.1",
  
  info: {
    version: "1.0.0",
    title: "API Specification Example"
  },
  
  servers: [
    { url: "http://localhost:8888" },
    { url: "https://food-delivery-app-api.netlify.app" }
  ],

  paths: {
    // Authorization routes
    "/api/auth": {
      post: {
        summary: "My account",
        operationId: "myAccount",
        tags: ["Authentication"],
        security: {
          IdToken: []
        },
      },
    },
    "/api/auth/login": {
      post: {
        summary: "Sign-in account",
        operationId: "login",
        tags: ["Authentication"],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserLogin" },
            },
          },
        }
      },
    },
    "/api/auth/sign-up": {
      post: {
        summary: "Sign-up account",
        operationId: "signUp",
        tags: ["Authentication"],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserRegister" },
            },
          },
        }
      },
    },
    "/api/auth/password-change": {
      post: {
        summary: "Signed in user password change",
        operationId: "passwordChange",
        tags: ["Authentication"],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserPasswordChange" },
            },
          },
        }
      },
    },

    // Categories routes
    "/api/categories": {
      get: {
        summary: "Get categories",
        operationId: "categories",
        tags: ["Categories"],
      },
    },

    // Products routes
    "/api/products": {
      get: {
        summary: "Get products",
        operationId: "products",
        tags: ["Products"],
      },
    },
  },

  components: {
    securitySchemes: {
      IdToken: {
        in: "header",
        type: "apiKey",
        name: "Authorization"
      }
    },
    schemas: {
      UserLogin: {
        required: ["email", "password"],
        properties: {
          email: {
            description: "User email",
            type: "string",
            maxLength: 120,
            example: "your@example.com",
          },
          password: {
            description: "User password",
            type: "password",
            minLength: 6,
            maxLength: 20,
            example: "123456789",
          },
        },
      },
      UserRegister: {
        required: ["firstName", "lastName", "phoneNumber", "email", "password"],
        properties: {
          lastName: {
            description: "User lastName",
            type: "string",
            maxLength: 120,
            example: "Ivanov",
          },
          firstName: {
            description: "User firstName",
            type: "string",
            maxLength: 120,
            example: "Ivan",
          },
          email: {
            description: "User email",
            type: "string",
            maxLength: 120,
            example: "your@example.com",
          },
          phoneNumber: {
            description: "User phoneNumber",
            type: "string",
            maxLength: 120,
            example: "+123123123123",
          },
          password: {
            description: "User password",
            type: "password",
            minLength: 6,
            maxLength: 20,
            example: "123456789",
          },
        },
      },
      UserPasswordChange: {
        required: ["password"],
        properties: {
          password: {
            description: "New password",
            type: "password",
            minLength: 6,
            maxLength: 20,
            example: "Ahj%456789",
          },
        },
      },
    }
  },
};
