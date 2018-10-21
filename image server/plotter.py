from PIL import Image, ImageDraw, ImageFont
import matplotlib.cm as cm
import matplotlib.colors as colors
import datetime
import requests
import time

cmap = Image.open("cmap.png")

def cdTransform(cdy, cdx, resy, resx):
    return [resy-(cdy+90)*resy/180, (cdx+180)*resx/360]

def findMinMax(data, index):
    mini = 0
    maxi = 0
    for each in data:
        item = float(each.split(",")[index])
        if item < mini:
            mini = item
        elif item > maxi:
            maxi = item
    return [mini, maxi]

def colorGrad(mini, maxi, val):
    if val > 200:
        val = 200
    norm = colors.Normalize(vmin=0, vmax=14.15)
    f2rgb = cm.ScalarMappable(norm=norm, cmap=cm.get_cmap('plasma'))
    rgb = f2rgb.to_rgba(val**0.5)[:3]
    return '#%02x%02x%02x' % tuple([int(255*fc) for fc in rgb])

def plotData(cmap):
    img = Image.open("/var/www/html/static/backg.jpg")
    resx, resy = [img.size[0], img.size[1]]
    img.paste(cmap, (resx-1500, resy-300))                                                                                                                                                                                                         
    draw = ImageDraw.Draw(img)
    font = ImageFont.truetype("tahoma.ttf", 96)
    font2 = ImageFont.truetype("tahoma.ttf", 84)

    raw = requests.get("https://firms.modaps.eosdis.nasa.gov/active_fire/viirs/text/VNP14IMGTDL_NRT_Global_24h.csv", stream=True).text.split("\n")[1:-1]
    minfrp, maxfrp = findMinMax(raw, -2)

    for each in raw:
        cdy, cdx = each.split(",")[0:2]
        color = colorGrad(minfrp, maxfrp, float(each.split(",")[-2]))
        pixelcds = cdTransform(float(cdy), float(cdx), resy, resx)
        draw.ellipse((pixelcds[1]-1, pixelcds[0]-1, pixelcds[1]+1, pixelcds[0]+1), fill=color)
    
    draw.text((90, resy-180), str(datetime.datetime.today().strftime('%Y-%m-%d %-I:%M %p'))+" ET", (0, 0, 0), font=font)
    titletext = "Fire Radiative Power (megawatts)"
    tsize = font.getsize(titletext)
    highlighting = Image.new('RGBA', (tsize[0]+60, tsize[1]+60), "white")
    hdraw = ImageDraw.Draw(highlighting)
    hdraw.text((30, 30), titletext, (0, 0, 0), font=font)
    img.paste(highlighting, (resx-1572, resy-510))
    draw.text((resx-1440, resy-240), "0", (0, 0, 0), font=font2)
    draw.text((resx-1191, resy-240), "12.5", (0, 0, 0), font=font2)
    draw.text((resx-816, resy-240), "173.2", (0, 0, 0), font=font2)
    draw.text((resx-408, resy-240), "200+", (0, 0, 0), font=font2)
    img.save('/var/www/html/static/map.png')

while True:
    plotData(cmap)
    time.sleep(900)
