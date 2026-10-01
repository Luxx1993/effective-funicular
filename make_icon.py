from PIL import Image, ImageDraw
S = 96
img = Image.new("RGB", (S, S), "black")
ImageDraw.Draw(img).ellipse((8, 8, S - 8, S - 8), fill="#FE5000")
img.save("icon.png")
