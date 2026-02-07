import asyncio
from aiogram import Bot, Dispatcher, types
from aiogram.filters import CommandStart
from aiogram.types import WebAppInfo
from aiogram.utils.keyboard import InlineKeyboardBuilder

BOT_TOKEN = '8599787408:AAHdUP8qj6Zlft-Tt7Hl6Ytxc6Wf0ol2TjQ'
# Ссылка на твой хостинг, где будут лежать файлы Mini App
APP_URL = 'https://qwexgp.github.io/borov_clk/'

bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

@dp.message(CommandStart())
async def start(message: types.Message):
    builder = InlineKeyboardBuilder()
    builder.row(types.InlineKeyboardButton(
        text="Играть в Borov Clicker 🐗", 
        web_app=WebAppInfo(url=APP_URL))
    )
    
    await message.answer(
        "Добро пожаловать, Боров! Жми на кнопку и фарми монеты.",
        reply_markup=builder.as_markup()
    )

async def main():
    await dp.start_polling(bot)

if __name__ == "__main__":
    asyncio.run(main())
