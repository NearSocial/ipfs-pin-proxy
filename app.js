require("dotenv").config();
const cors = require("@koa/cors");

const FormData = require("form-data");
const contentType = require("content-type");
const getRawBody = require("raw-body");
const Koa = require("koa");
const app = new Koa();
app.proxy = true;

const Router = require("koa-router");
const router = new Router();

const axios = require("axios");

const PostTimeout = 30000;

(async () => {
  router.post("/add", async (ctx) => {
    ctx.type = "application/json; charset=utf-8";
    try {
      const body = ctx.request.rawBody;

      // const w3sUpload = axios({
      //   method: "post",
      //   url: "https://api.web3.storage/upload",
      //   headers: {
      //     Accept: "application/json",
      //     Authorization: `Bearer ${process.env.WEB3STORAGE_TOKEN}`,
      //   },
      //   data: body,
      //   timeout: PostTimeout,
      // });

      const formData = new FormData();
      formData.append("data", body, "img");

      const estuaryUpload = axios({
        method: "post",
        url: "https://upload.estuary.tech/content/add",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${process.env.ESTUARY_KEY}`,
        },
        data: formData,
        timeout: PostTimeout,
      });
      // console.log(await estuaryUpload);

      const formData2 = new FormData();
      formData2.append("file", body, "img");

      const localUpload = axios({
        method: "post",
        url: process.env.LOCAL_IPFS_API,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/x-www-form-urlencoded",
        },
        data: formData,
        timeout: PostTimeout,
      });
      const [w3sRes, localRes] = await Promise.all([
        estuaryUpload,
        localUpload,
      ]);
      console.log(w3sRes, localRes);
      const cid = localRes.data.Hash;
      const cid1 = w3sRes.data.cid;
      ctx.body = cid === cid1 ? { cid } : { cid, estuary_cid: cid1 };
    } catch (e) {
      ctx.body = `err: ${e}`;
    }
  });

  app
    .use(async (ctx, next) => {
      console.log(ctx.method, ctx.path);
      await next();
    })
    .use(cors())
    .use(async (ctx, next) => {
      const req = ctx.req;
      ctx.request.rawBody = await getRawBody(req, {
        length: req.headers["content-length"],
        limit: "32mb",
        encoding: contentType.parse(req).parameters.charset,
      });
      await next();
    })
    .use(router.routes())
    .use(router.allowedMethods());

  const PORT = process.env.PORT || 3000;
  app.listen(PORT);
  console.log("Listening on http://127.0.0.1:%d/", PORT);
})();
