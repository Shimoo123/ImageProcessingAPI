import express from 'express';
import resize from '../utilities/resize-image';
import { promises as fsPromises } from 'fs';
import url from 'url';
import { queryParams } from '../DTO/params.dto';
import { parsedQueryParams } from '../DTO/parsedParams.dto';
import validateParams from '../utilities/validateInputs';
import NodeCache from 'node-cache';
const myCache = new NodeCache({ stdTTL: 100, checkperiod: 120 });
const imageRoute = express.Router();

imageRoute.get('/', async (req: express.Request, res: express.Response): Promise<Response> =>  {
    const params: queryParams  = await JSON.parse(
      '{"' +
        decodeURI(url.parse(req.url).query as unknown as string)
          .replace(/&/g, '","')
          .replace(/=/g, '":"') +
        '"}'
    );
    const notValid = validateParams(params);
    if(notValid){
     return ((res.status(400).end('Missing input value') as unknown) as Response) ;
    }
    const parsedParams : parsedQueryParams ={
      filename : params.filename,   
      width : parseInt(params.width),
      height : parseInt(params.height)
    };
    if(isNaN(parsedParams.width) || isNaN(parsedParams.height))
    {
    return ((res.status(400).end('Invalid width or height') as unknown) as Response);
    }
    const mykey: string = parsedParams.filename+parsedParams.width+parsedParams.height;
    const existInCache: unknown = myCache.get(mykey);
    
    if(existInCache == undefined) {

   const done: unknown = await resize(parsedParams.filename,parsedParams.width,parsedParams.height);
   const Done: string[] =(done as unknown)as string[];
   
   if(Done[0] == 'false'){
    return ((res.status(400).send(Done[1])as unknown) as Response) ;
   }
     return ((res.writeHead(200, { 'Content-Type': 'image/jpg' })
        .end(await fsPromises.readFile(`./assets/thumb/${parsedParams.filename}.jpg`))as unknown) as Response);
    myCache.set(mykey,`./assets/thumb/${parsedParams.filename}.jpg`);
    }
    else {
      return  ((res.writeHead(200, { 'Content-Type': 'image/jpg' })
           .end(await fsPromises.readFile((existInCache as unknown)as string))as unknown) as Response);
    }
   
  });

  export default imageRoute;
