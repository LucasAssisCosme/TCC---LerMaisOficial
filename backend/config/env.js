require("dotenv").config();

const path = require("path");

const backendRootDir = path.resolve(__dirname, "..");
const port = Number(process.env.PORT) || 3000;
const appBaseUrl = String(
  process.env.APP_BASE_URL || `http://localhost:${port}`,
).replace(/\/$/, "");
const publicApiBaseUrl = String(
  process.env.PUBLIC_API_BASE_URL || appBaseUrl,
).replace(/\/$/, "");

const uploadsRootDir = process.env.UPLOADS_ROOT_DIR
  ? path.resolve(backendRootDir, process.env.UPLOADS_ROOT_DIR)
  : path.join(backendRootDir, "uploads");

const uploadsRoutePrefix = String(
  process.env.UPLOADS_ROUTE_PREFIX || "uploads",
).replace(/^\/+|\/+$/g, "");

const profileUploadSubdir = String(
  process.env.PROFILE_UPLOAD_SUBDIR || "perfis",
).replace(/^\/+|\/+$/g, "");

const bookCoverUploadSubdir = String(
  process.env.BOOK_COVER_UPLOAD_SUBDIR || "livro_capa",
).replace(/^\/+|\/+$/g, "");

const profileUploadDir = path.join(uploadsRootDir, profileUploadSubdir);
const bookCoverUploadDir = path.join(uploadsRootDir, bookCoverUploadSubdir);

const corsOriginRaw = String(process.env.CORS_ORIGIN || "*");
const corsOrigins = corsOriginRaw
  .split(",")
  .map((item) => item.trim())
  .filter(Boolean);

const defaultBookCoverUrl =
  process.env.DEFAULT_BOOK_COVER_URL ||
  "https://gabrielchalita.com.br/wp-content/uploads/2019/12/semcapa.png";

if (!process.env.JWT_SECRET) {
  console.warn(
    "[ENV] JWT_SECRET não definido. Configure essa variável no backend/.env.",
  );
}

const jwtSecret = process.env.JWT_SECRET || `${appBaseUrl}-jwt-secret`;
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || "24h";
const dbHost = process.env.DB_HOST || "localhost";
const dbPort = process.env.DB_PORT || "3306";
const dbName = process.env.DB_NAME || "sistema_leitura";
const dbUser = process.env.DB_USER || "root";
const dbPassword = process.env.DB_PASSWORD || "usbw";

function buildPublicPath(...segments) {
  return `/${[uploadsRoutePrefix, ...segments]
    .filter(Boolean)
    .map((segment) => String(segment).replace(/^\/+|\/+$/g, ""))
    .join("/")}`;
}

function buildPublicUrl(relativePath) {
  if (!relativePath) {
    return publicApiBaseUrl;
  }

  if (/^https?:\/\//i.test(relativePath)) {
    return relativePath;
  }

  const normalized = relativePath.startsWith("/")
    ? relativePath
    : `/${relativePath}`;

  return `${publicApiBaseUrl}${normalized}`;
}

const corsOptions =
  corsOrigins.length === 0 || corsOrigins.includes("*")
    ? {}
    : {
        origin(origin, callback) {
          if (!origin || corsOrigins.includes(origin)) {
            callback(null, true);
            return;
          }

          callback(new Error("Origem não permitida pelo CORS"));
        },
      };

module.exports = {
  port,
  appBaseUrl,
  publicApiBaseUrl,
  uploadsRootDir,
  uploadsRoutePrefix,
  profileUploadSubdir,
  bookCoverUploadSubdir,
  profileUploadDir,
  bookCoverUploadDir,
  corsOptions,
  defaultBookCoverUrl,
  jwtSecret,
  jwtExpiresIn,
  dbHost,
  dbPort,
  dbName,
  dbUser,
  dbPassword,
  buildPublicPath,
  buildPublicUrl,
};
