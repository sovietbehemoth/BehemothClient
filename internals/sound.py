import sys
import playsound

from os.path import exists

file = sys.argv[1]

if (not exists(file)):
    exit(1)

playsound.playsound(file)