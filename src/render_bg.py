import asyncio, glob, os, io
from playwright.async_api import async_playwright
from PIL import Image
SP='/tmp/claude-0/-home-user/fcbf269f-66c5-531f-8bdf-656945e2957d/scratchpad/'
OUT='/home/user/effective-funicular/assets/'
async def main():
    async with async_playwright() as p:
        b=await p.chromium.launch(executable_path='/opt/pw-browsers/chromium')
        for f in sorted(glob.glob(SP+'out/bg-*.svg')):
            name=os.path.basename(f)[:-4]
            pg=await b.new_page(viewport={'width':800,'height':320})
            await pg.goto('file://'+f); await pg.wait_for_timeout(120)
            png=await pg.screenshot(type='png')
            Image.open(io.BytesIO(png)).convert('RGB').save(OUT+name+'.webp','WEBP',quality=78,method=6)
            await pg.close()
        await b.close()
asyncio.run(main())
