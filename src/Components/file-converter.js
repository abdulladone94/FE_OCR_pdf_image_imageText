// import { Download } from '@mui/icons-material';
import {
  Box,
  Button,
  CircularProgress,
  Grid,
  // IconButton,
  Stack,
} from '@mui/material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import React, { useEffect, useMemo, useRef, useState } from 'react';
// import { Cropper } from 'react-cropper';

import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { canvasPreview } from './cropImage';
import axios from 'axios';
import toast from 'react-hot-toast';
var pdfjsLib = window['pdfjs-dist/build/pdf'];
pdfjsLib.GlobalWorkerOptions.workerSrc = './assets/js/pdf.worker.js';

function FileConverter({ pdfUrl, fileName }) {
  const myRef = React.createRef();
  // const cropperRef = useRef(null);
  const imgRef = useRef(null);
  console.log(imgRef);

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imageUrls, setImageUrls] = useState([]);
  const [numOfPages, setNumOfPages] = useState(0);
  const [selectedImage, setSelectedImage] = useState(null);

  const [crop, setCrop] = useState(null);
  const [completedCrop, setCompletedCrop] = useState();
  const [height, setHeight] = useState('');
  const [width, setWidth] = useState('');

  const [cropImage, setCropImage] = useState('');

  console.log(imageUrls);
  console.log(completedCrop);
  console.log(selectedImage);
  console.log(cropImage);

  useEffect(() => {
    setLoading(false);
  }, [imageUrls]);

  const handleClickOpen = (url, index) => {
    console.log(url);
    setSelectedImage({ url, index });
    setOpen(true);
  };

  const handleClose = () => {
    setSelectedImage(null);
    setOpen(false);
  };

  let imageCounter = 1;
  const UrlUploader = (url) => {
    fetch(url).then((response) => {
      response.blob().then((blob) => {
        let reader = new FileReader();
        reader.onload = (e) => {
          const data = atob(e.target.result.replace(/.*base64,/, ''));
          const imageName = `${imageCounter}.png`;
          imageCounter++;
          renderPage(data, imageName);
        };
        reader.readAsDataURL(blob);
      });
    });
  };

  useMemo(() => {
    UrlUploader(pdfUrl);
  }, []);

  const renderPage = async (data) => {
    setLoading(true);
    const imagesList = [];
    const canvas = document.createElement('canvas');
    canvas.setAttribute('className', 'canv');
    const pdf = await pdfjsLib.getDocument({ data }).promise;
    for (let i = 1; i <= pdf.numPages; i++) {
      var page = await pdf.getPage(i);
      var viewport = page.getViewport({ scale: 1.5 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      var render_context = {
        canvasContext: canvas.getContext('2d'),
        viewport: viewport,
      };
      await page.render(render_context).promise;
      let img = canvas.toDataURL('image/png');
      imagesList.push(img);
    }
    setNumOfPages((e) => e + pdf.numPages);
    setImageUrls((e) => [...e, ...imagesList]);
  };

  useEffect(() => {
    myRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    console.log(
      myRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    );
  }, [imageUrls]);

  const downloadImage = (url, index) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `${fileName}_${index + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    handleClose();
  };

  const onImageLoad = (e) => {
    setHeight(e?.currentTarget?.height);
    setWidth(e?.currentTarget?.width);
    setCompletedCrop({
      x: 0,
      y: 0,
      height: e?.currentTarget?.height,
      width: e?.currentTarget?.width,
      unit: 'px',
    });
  };

  // test 3
  const cropImagePost = async () => {
    console.log(imgRef.current);

    // Update the cropImage state
    const newCropImage = await canvasPreview(imgRef.current, completedCrop);
    setCropImage(newCropImage);

    try {
      // Use the updated cropImage state in the axios post request
      const response = await axios.post('http://localhost:3000/crop', {
        crop_page_no: selectedImage.index + 1,
        crop_image: newCropImage,
      });

      // Convert Buffer data to Blob
      const blob = new Blob([new Uint8Array(response.data)], {
        type: 'image/png',
      });
      console.log(response.data);

      // Create a data URL from the Blob
      const dataUrl = URL.createObjectURL(blob);

      // Set the data URL as the image source
      setOpen(false);
      toast.success(response.data);
    } catch (error) {
      console.error('Error posting crop image:', error);
      toast.error('Error posting crop image:', error);
    }
  };

  return (
    <Box sx={{ my: 4, textAlign: 'center' }} ref={myRef} id="image-container">
      {loading ? (
        <CircularProgress />
      ) : (
        <>
          {imageUrls.length > 0 && (
            <>
              <h4 className="drop-file-preview__title">
                Converted Images - {numOfPages}
              </h4>
              <Grid container spacing={3}>
                {imageUrls.map((url, index) => (
                  <Grid item xs={12} sm={4} key={index}>
                    <Box
                      onClick={() => handleClickOpen(url, index)}
                      sx={{ width: '100%', height: '250px' }}
                      className="img-card"
                    >
                      <img
                        src={url}
                        alt={`Page ${index + 1}`}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                      <Stack
                        direction="row"
                        spacing={1}
                        sx={{ position: 'absolute', top: 2, right: 2 }}
                      >
                        {/* <IconButton
                          onClick={() => downloadImage(url, index)}
                          className="btn-bg"
                        >
                          <Download />
                        </IconButton> */}
                      </Stack>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </>
      )}
      <Dialog
        open={open}
        onClose={handleClose}
        scroll={'paper'}
        aria-labelledby="scroll-dialog-title"
        aria-describedby="scroll-dialog-description"
      >
        <DialogTitle id="scroll-dialog-title">Preview</DialogTitle>

        <DialogContent dividers={true}>
          {/* <Cropper
            src={selectedImage?.url}
            style={{ height: 400, width: '100%' }}
            initialAspectRatio={16 / 9}
            guides={false}
            ref={cropperRef}
          /> */}
          {/* <img
            src={selectedImage?.url}
            alt={selectedImage?.url}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          /> */}

          <ReactCrop
            src={selectedImage?.url}
            crop={crop}
            onChange={(_, percentCrop) => {
              setCrop(percentCrop);
            }}
            onComplete={(e) => {
              if (e?.height === 0 || e?.width === 0) {
                setCompletedCrop({
                  x: 0,
                  y: 0,
                  height: height,
                  width: width,
                  unit: 'px',
                });
              } else {
                setCompletedCrop(e);
              }
            }}
          >
            <img
              ref={imgRef}
              crossorigin="anonymous"
              alt="Error"
              src={selectedImage?.url}
              // style={{ transform: `scale(${scale}) rotate(${rotation}deg)` }}
              onLoad={onImageLoad}
            />
          </ReactCrop>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button variant="outlined" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() =>
              downloadImage(selectedImage.url, selectedImage.index)
            }
          >
            Download
          </Button>
          <Button variant="contained" onClick={cropImagePost}>
            Crop
          </Button>
          {/* <Button variant="contained" onClick={cropImagePost}>
            CropPost
          </Button> */}
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default FileConverter;
