from PIL import Image
import sys
import os.path

def main(file):
    img = Image.open(file).convert('RGBA')
    pixels = img.load()
    w, h = img.size

    for x in range(w):
        for y in range(h):
            # print(pixels[x, y][:3])
            if pixels[x, y][:3] == (200, 191, 231):
                pixels[x, y] = (0, 0, 0, 0) # Make transparent

    base = os.path.basename(file)
    img.save(f'new-{base}')

# Run
args = sys.argv
if len(args) < 2:
    print('No image file specified')
else:
    main(args[1])
