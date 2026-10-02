import asyncio, glob, os, sys, io
from playwright.async_api import async_playwright
from PIL import Image
SP='/tmp/claude-0/-home-user/fcbf269f-66c5-531f-8bdf-656945e2957d/scratchpad/'
OUT='/home/user/effective-funicular/assets/'
os.makedirs(OUT,exist_ok=True)
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
        for f in sorted(glob.glob(SP+'out/*.svg')):
            name=os.path.basename(f)[:-4]
            sheet=name.startswith('sheet')
            w,h=(1680,1716) if sheet else (800,320)
            pg=await b.new_page(viewport={'width':w,'height':h})
            await pg.goto('file://'+f)
            await pg.wait_for_timeout(150)
            png=await pg.screenshot(omit_background=sheet, type='png')
            im=Image.open(io.BytesIO(png))
            if sheet: im.save(OUT+name+'.webp','WEBP',quality=88,method=6)
            else: im.convert('RGB').save(OUT+name+'.webp','WEBP',quality=78,method=6)
            await pg.close()
        await b.close()
asyncio.run(main())
