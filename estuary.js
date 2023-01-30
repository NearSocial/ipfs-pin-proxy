require("dotenv").config();
const fs = require("fs");
const fsPromises = require("fs/promises");

const FormData = require("form-data");
const contentType = require("content-type");

const axios = require("axios");

const PostTimeout = 30000;

function saveJson(json, filename) {
  try {
    const data = JSON.stringify(json);
    fs.writeFileSync(filename, data);
  } catch (e) {
    console.error("Failed to save JSON:", filename, e);
  }
}

function loadJson(filename, ignore) {
  try {
    let rawData = fs.readFileSync(filename);
    return JSON.parse(rawData);
  } catch (e) {
    if (!ignore) {
      console.error("Failed to load JSON:", filename, e);
    }
  }
  return null;
}

(async () => {
  const estuary = loadJson("estuary.json", true) || {
    uploads: {},
    success: {},
  };
  const fn = `uploads-${Date.now()}.txt`;
  try {
    await fsPromises.rename("uploads.txt", fn);
    const uploads = fs.readFileSync(fn, "utf8").trim().split("\n");
    uploads.forEach((upload) => {
      if (estuary.success[upload]) {
        return;
      }
      estuary.uploads[upload] = true;
    });
  } catch {}

  saveJson(estuary, "estuary.json");
  try {
    await fsPromises.rm(fn);
  } catch {}

  // console.log(estuary);
  for (const upload of Object.keys(estuary.uploads)) {
    try {
      console.log("Fetching:", upload);
      const res = await axios({
        method: "get",
        url: "https://ipfs.near.social/ipfs/" + upload,
        timeout: PostTimeout,
        headers: {
          Referer: "https://near.social/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
      });
      const body = res.data;

      const formData = new FormData();
      try {
        formData.append("data", body, "img");

        console.log(`Uploading ${body.length} bytes:`, upload);
      } catch (e) {
        estuary.success[upload] = false;
        delete estuary.uploads[upload];
        saveJson(estuary, "estuary.json");
        throw e;
      }

      await axios({
        method: "post",
        url: "https://upload.estuary.tech/content/add",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${process.env.ESTUARY_KEY}`,
        },
        data: formData,
        timeout: PostTimeout,
      });

      estuary.success[upload] = true;
      delete estuary.uploads[upload];
      saveJson(estuary, "estuary.json");
    } catch (e) {
      console.error(e.toString());
      break;
    }
  }

  console.log("All done");
  saveJson(estuary, "estuary.json");
})();
