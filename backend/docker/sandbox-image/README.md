# NWroot.io Sandbox Image

Build this image once on your server before starting the backend:

```bash
docker build -t nwroot-sandbox .
```

The backend creates one container from this image per active user session.
The image name here MUST match the `SANDBOX_IMAGE_NAME` value in the root `.env` file.
