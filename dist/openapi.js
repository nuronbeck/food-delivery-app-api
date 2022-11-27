var spec = {
  openapi: "3.0.1",
  
  info: {
    version: "1.0.0",
    title: "API Specification Example"
  },

  paths: {
    "/auth/login": {
      post: {
        summary: "Sign-in account",
        operationId: "login",
        tags: ["login"],
        requestBody: {
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/UserLogin" },
            },
          },
        }
      },
    },
  },

  components: {
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
    }
  },
};
