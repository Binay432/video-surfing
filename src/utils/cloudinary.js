import {v2 as cloudinary} from "cloudinary"
import fs from "fs" // node service to manage file system



// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try{
        if(!localFilePath) return null;

        //upload the file on clouydinary 
       const response = await cloudinary.uploader.upload (localFilePath, {
            resource_type : "auto"
        })

        // file has been uploaded successfull
        // console.log("file is uploaded on cloudinary", response.url);
        fs.unlinkSync(localFilePath);
        return response;

    } catch (error) {
        console.log(`Error on uploading file: ${JSON.stringify(error, null, 2)}`)
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed 
        return error;
    }
}

const deleteFromCloudinary = async (filePublicId, resourceType) => {
    try{

        if(!filePublicId) {
            return "Public id not found"
        }

        const response = await cloudinary.uploader.destroy(filePublicId,{
            type:"upload",
            resource_type: resourceType
        })

        if (!response){
            return "Error occured while deleting file"
        }
        
        return response
    }catch(error) {
        console.log(`Error occur on deleting from cloudinary: ${error}`)
        return error
    }
}
export {
    uploadOnCloudinary,
    deleteFromCloudinary
}

