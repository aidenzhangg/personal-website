from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
import textwrap
ROOT=Path(__file__).resolve().parents[1]
img=Image.new('RGB',(1200,630),'#0b0a0c');d=ImageDraw.Draw(img)
def font(size,bold=False):return ImageFont.truetype('C:/Windows/Fonts/segoeuib.ttf' if bold else 'C:/Windows/Fonts/segoeui.ttf',size)
def text(x,y,t,size=16,fill='#eee3e9',bold=False):d.text((x,y),t,font=font(size,bold),fill=fill)
def icon(name,box):
 p=ROOT/'public/icons'/name
 if p.exists():
  im=Image.open(p).convert('RGBA');im.thumbnail((box[2],box[3]));img.paste(im,(box[0],box[1]),im)
d.rounded_rectangle((18,14,1182,613),radius=9,fill='#171717',outline='#55313d',width=1)
d.rectangle((19,24,1181,49),fill='#252125')
icon('section-about.png',(33,26,16,16));text(57,24,'About',13)
text(1078,22,'—     □     ×',15,fill='#c3b7be')
d.rectangle((19,49,1181,95),fill='#201b1e');text(35,58,'‹',23)
d.rounded_rectangle((70,57,839,85),radius=4,fill='#171717',outline='#3e3138');text(84,61,'Portfolio   ›   About',12,fill='#cabcc4')
d.rounded_rectangle((858,55,1003,88),radius=4,fill='#81243a');text(881,62,'View Projects',12,bold=True)
text(1025,62,'Resume PDF',12,fill='#ead4df')
d.rectangle((19,96,217,586),fill='#131313');d.line((217,96,217,586),fill='#35272f')
text(36,115,'PORTFOLIO',10,fill='#af97a3')
rows=[('About','section-about.png'),('Experience','section-experience.png'),('Projects','explorer.png'),('Engineering Experience','section-activities.png'),('Technical Skills','section-skills.png'),('Certifications','section-certifications.png'),('Resume','word.png'),('Portfolio','section-portfolio.png'),('Education','waterloo-crest.png'),('Contact','gmail.png')]
for i,(label,file) in enumerate(rows):
 y=153+i*37
 if i==0:d.rounded_rectangle((28,y-6,207,y+26),radius=4,fill='#35212b');d.rounded_rectangle((28,y+2,31,y+18),radius=1,fill='#d5678b')
 icon(file,(39,y,18,18));text(66,y,label,12,fill='#f3dce7' if i==0 else '#c9bfc5')
x=266
text(x,121,'PERSONAL PORTFOLIO',10,fill='#c5869f')
pixel=ImageFont.truetype(str(ROOT/'.tools/fonts-dl/PixelifySans.ttf'),72)
d.text((x,147),'Aiden Zhang',font=pixel,fill='#f1e8ed')
d.rectangle((713,202,733,208),fill='#a93455')
text(x,242,'University of Waterloo',21,bold=True)
text(x,274,'Computer Engineering with Co-op',16,fill='#d2bec9')
text(x,308,'Seeking Summer 2027 Co-op',20,fill='#e5adc4',bold=True)
text(x,344,'a522zhan@uwaterloo.ca',14,fill='#d0c3cb')
buttons=[('View Projects','#81243a'),('View Resume (PDF)','#291d24'),('View Portfolio (PDF)','#291d24')]
for i,(label,color) in enumerate(buttons):
 bx=x+i*288;d.rounded_rectangle((bx,384,bx+274,429),radius=4,fill=color,outline='#815067');text(bx+26,397,label,14,bold=True)
# Keep the sharing preview focused on the introduction and main actions.
d.line((x,534,1120,534),fill='#3e2b35');text(x,552,'GitHub       LinkedIn',13,fill='#d9bdcc');text(920,552,'aidenzhang.vercel.app',12,fill='#bba0ad')
d.rectangle((19,587,1181,612),fill='#100e10');text(34,591,'© 2026 Aiden Zhang',10,fill='#af9aa5')
# Share only the intro content, without the desktop frame or navigation.
intro_crop = img.crop((250, 108, 1136, 578))
intro_crop.thumbnail((1080, 550), Image.Resampling.LANCZOS)
cover = Image.new('RGB', (1200, 630), '#171717')
cover.paste(intro_crop, ((1200-intro_crop.width)//2, (630-intro_crop.height)//2))
cover.save(ROOT/'public/homepage-preview.png',optimize=True)
cover.save(ROOT/'public/intro-preview-v2.png',optimize=True)
print('Saved homepage-preview.png (1200 x 630)')
