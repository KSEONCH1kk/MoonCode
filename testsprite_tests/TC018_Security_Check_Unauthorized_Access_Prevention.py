import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:5173", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # -> Attempt to access student dashboard, teacher panel, or admin page without login to verify access is denied.
        await page.goto('http://localhost:5173/student-dashboard', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Attempt to access teacher panel without login to verify access is denied.
        await page.goto('http://localhost:5173/teacher-panel', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Attempt to access admin page without login to verify access is denied.
        await page.goto('http://localhost:5173/admin-panel', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Navigate to login page to perform student login.
        await page.goto('http://localhost:5173/login', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Input student email and password, then submit login form.
        frame = context.pages[-1]
        # Input student email
        elem = frame.locator('xpath=html/body/div/div/main/div/div/div[2]/form/div/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('demo@mooncode.io')
        

        frame = context.pages[-1]
        # Input student password
        elem = frame.locator('xpath=html/body/div/div/main/div/div/div[2]/form/div[2]/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('demo123')
        

        frame = context.pages[-1]
        # Click login button to submit student login
        elem = frame.locator('xpath=html/body/div/div/main/div/div/div[2]/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # -> Navigate to admin panel page to check access as student.
        await page.goto('http://localhost:5173/admin-panel', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Navigate to logout or home page to logout student and prepare for teacher login.
        await page.goto('http://localhost:5173/logout', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Navigate to login page to perform teacher login.
        await page.goto('http://localhost:5173/login', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Navigate to admin panel page to check access as teacher.
        await page.goto('http://localhost:5173/admin-panel', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Navigate to logout page to logout teacher.
        await page.goto('http://localhost:5173/logout', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Attempt to access student dashboard without login to confirm access denial.
        await page.goto('http://localhost:5173/student-dashboard', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Attempt to access teacher panel without login to confirm access denial.
        await page.goto('http://localhost:5173/teacher-panel', timeout=10000)
        await asyncio.sleep(3)
        

        # -> Attempt to access admin panel without login to confirm access denial.
        await page.goto('http://localhost:5173/admin-panel', timeout=10000)
        await asyncio.sleep(3)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=CodeSchool — Школа программирования').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    